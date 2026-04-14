package com.interntoolsfyi.admin.controller;

import com.interntoolsfyi.admin.dto.AdminUserResponse;
import com.interntoolsfyi.admin.dto.UpdateUserRoleRequest;
import com.interntoolsfyi.admin.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminUserController {

  private final AdminUserService adminUserService;

  public AdminUserController(AdminUserService adminUserService) {
    this.adminUserService = adminUserService;
  }

  @GetMapping
  public Page<AdminUserResponse> listUsers(
      @RequestParam(required = false) String search,
      @PageableDefault(size = 10, sort = "username", direction = Sort.Direction.ASC) Pageable pageable) {
    return adminUserService.listUsers(pageable, search);
  }

  @PatchMapping("/{id}")
  @ResponseStatus(HttpStatus.OK)
  public AdminUserResponse updateRole(
      @PathVariable Long id, @Valid @RequestBody UpdateUserRoleRequest request) {
    return adminUserService.updateUserRole(id, request.role());
  }
}
